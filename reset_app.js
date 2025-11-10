// MedRec Plus - Complete Reset Script
// Run this in browser console to completely reset the app state

console.log('🔄 Starting MedRec Plus complete reset...');

// Function to clear localStorage items
function clearLocalStorageItems() {
    const keysToRemove = [
        'medrec_app_locked',
        'medrec_lock_time',
        'medrec_dev_password',
        'medrec_dev_encryption_setup',
        'app_settings' // This contains UnifiedStorage data
    ];

    let removedCount = 0;
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
            console.log(`✅ Removed: ${key}`);
        }
    });

    return removedCount;
}

// Function to clear IndexedDB
function clearIndexedDB() {
    return new Promise((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('medrec-storage');
        deleteRequest.onsuccess = () => {
            console.log('✅ IndexedDB cleared');
            resolve(true);
        };
        deleteRequest.onerror = () => {
            console.log('⚠️ Error clearing IndexedDB');
            resolve(false);
        };
    });
}

// Main reset function
async function resetApp() {
    try {
        console.log('🧹 Clearing localStorage...');
        const localStorageCount = clearLocalStorageItems();

        console.log('🗄️ Clearing IndexedDB...');
        const indexedDbCleared = await clearIndexedDB();

        console.log(`\n📊 Reset Summary:`);
        console.log(`- LocalStorage items removed: ${localStorageCount}`);
        console.log(`- IndexedDB cleared: ${indexedDbCleared ? 'Yes' : 'No'}`);

        console.log('\n✅ App reset complete!');
        console.log('🚀 Refreshing the page to show encryption setup...');

        // Refresh the page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('❌ Reset failed:', error);
        console.log('💡 You may need to manually clear browser data');
    }
}

// Auto-run the reset
resetApp();