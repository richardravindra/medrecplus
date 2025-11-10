import React, { Suspense } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';
import Typography from '@mui/joy/Typography';

interface ChartData {
  month: string;
  count?: number;
  revenue?: number;
  [key: string]: string | number | undefined;
}

interface LazyBarChartProps {
  data: ChartData[];
  dataKey: string;
  fill: string;
  height?: number;
  width?: number;
  minWidth?: number;
  minHeight?: number;
  title?: string;
}

const ChartComponent: React.FC<LazyBarChartProps> = ({
  data,
  dataKey,
  fill,
  height = 220,
  width,
  minWidth = 200,
  minHeight = 200,
  title
}) => {
  return (
    <Box>
      {title && (
        <Typography level="body-sm" sx={{ mb: 1, color: '#999' }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer
        width={width || '100%'}
        height={height}
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <BarChart
          data={data}
          margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#444"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: '#999', fontSize: 12 }}
            axisLine={{ stroke: '#666' }}
          />
          <YAxis
            tick={{ fill: '#999', fontSize: 12 }}
            axisLine={{ stroke: '#666' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#999' }}
          />
          <Bar
            dataKey={dataKey}
            fill={fill}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

const LoadingFallback: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: `${height}px`,
      color: '#666'
    }}
  >
    <CircularProgress size="lg" />
    <Typography level="body-sm" sx={{ mt: 1 }}>
      Loading chart...
    </Typography>
  </Box>
);

export const LazyBarChart: React.FC<LazyBarChartProps> = (props) => {
  return (
    <Suspense fallback={<LoadingFallback height={props.height} />}>
      <ChartComponent {...props} />
    </Suspense>
  );
};

export default LazyBarChart;