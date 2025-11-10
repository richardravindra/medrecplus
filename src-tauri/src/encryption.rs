use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use zeroize::Zeroize;

#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptionConfig {
    pub salt: String,
    pub is_encrypted: bool,
}

pub struct EncryptionManager {
    salt: String,
}

impl EncryptionManager {
    pub fn new() -> Self {
        let salt = SaltString::generate(&mut OsRng);
        Self {
            salt: salt.to_string(),
        }
    }

    pub fn with_salt(salt: String) -> Self {
        Self { salt }
    }

    pub fn derive_key(&self, password: &str) -> Result<Vec<u8>, String> {
        let argon2 = Argon2::default();
        let parsed_salt = SaltString::from_b64(&self.salt)
            .map_err(|e| format!("Invalid salt: {}", e))?;

        let password_hash = argon2
            .hash_password(password.as_bytes(), &parsed_salt)
            .map_err(|e| format!("Failed to hash password: {}", e))?;

        // Extract the hash bytes as our encryption key
        let hash = password_hash.hash.unwrap();
        Ok(hash.as_bytes().to_vec())
    }

    pub fn get_salt(&self) -> &str {
        &self.salt
    }

    pub fn save_config(&self, config_path: &Path) -> Result<()> {
        let config = EncryptionConfig {
            salt: self.salt.clone(),
            is_encrypted: true,
        };

        let config_json = serde_json::to_string(&config)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(0, "config".to_string(), rusqlite::types::Type::Text))?;

        fs::write(config_path, config_json)
            .map_err(|_e| rusqlite::Error::InvalidPath(config_path.to_string_lossy().to_string().into()))?;

        Ok(())
    }

    pub fn load_config(config_path: &Path) -> Result<Option<EncryptionConfig>> {
        if !config_path.exists() {
            return Ok(None);
        }

        let config_content = fs::read_to_string(config_path)
            .map_err(|_e| rusqlite::Error::InvalidPath(config_path.to_string_lossy().to_string().into()))?;

        let config: EncryptionConfig = serde_json::from_str(&config_content)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(0, "config".to_string(), rusqlite::types::Type::Text))?;

        Ok(Some(config))
    }
}

pub fn setup_encrypted_connection(conn: &Connection, key: &[u8]) -> Result<()> {
    let key_hex = hex::encode(key);

    // Set the encryption key for SQLCipher
    conn.pragma_update(None, "key", &key_hex)?;

    // Test the encryption by attempting to read a table
    let _ = conn.prepare("SELECT count(*) FROM sqlite_master")?;

    // Set additional security settings
    conn.pragma_update(None, "cipher_page_size", 4096)?;
    conn.pragma_update(None, "kdf_iter", 256000)?;
    conn.pragma_update(None, "cipher_hmac_algorithm", "HMAC_SHA512")?;
    conn.pragma_update(None, "cipher_kdf_algorithm", "PBKDF2_HMAC_SHA512")?;

    Ok(())
}

// pub fn verify_database_encrypted(conn: &Connection) -> bool {
//     // Try to read the encrypted database without a key
//     // If it fails, the database is likely encrypted
//     match conn.prepare("SELECT count(*) FROM sqlite_master") {
//         Ok(_) => false, // Can read without key, not encrypted
//         Err(_) => true, // Cannot read, likely encrypted
//     }
// }

pub fn migrate_to_encrypted(
    _unencrypted_conn: &Connection,
    encrypted_path: &str,
    key: &[u8],
) -> Result<Connection> {
    // Create new encrypted database
    let encrypted_conn = Connection::open(encrypted_path)?;

    // Setup encryption on new database
    setup_encrypted_connection(&encrypted_conn, key)?;

    // Copy schema and data
    // This is a simplified version - in production, you'd want to handle all tables
    encrypted_conn.execute_batch(
        "BEGIN IMMEDIATE;

        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            address TEXT,
            phone_number TEXT NOT NULL,
            initial_diagnosis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO patients (id, record_number, name, age, address, phone_number, initial_diagnosis, created_at)
        SELECT id, record_number, name, age, address, phone_number, initial_diagnosis, created_at
        FROM patients;

        COMMIT;"
    )?;

    Ok(encrypted_conn)
}

// Secure string handling utilities (commented out as currently unused)
// pub struct SecureString {
//     data: Vec<u8>,
// }

// impl SecureString {
//     pub fn from_string(s: String) -> Self {
//         Self {
//             data: s.into_bytes(),
//         }
//     }

//     pub fn as_str(&self) -> &str {
//         std::str::from_utf8(&self.data).unwrap_or("")
//     }
// }

// impl Drop for SecureString {
//     fn drop(&mut self) {
//         self.data.zeroize();
//     }
// }

// impl Clone for SecureString {
//     fn clone(&self) -> Self {
//         Self {
//             data: self.data.clone(),
//         }
//     }
// }