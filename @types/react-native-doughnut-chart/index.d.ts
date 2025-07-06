declare module 'react-native-doughnut-chart' {
  import * as React from 'react';
    import { ViewStyle } from 'react-native';

  export interface DoughnutChartProps {
    percentage?: number;
    showPercentage?: boolean;
    size?: number;
    fontColor?: string;
    areaBg?: string;
    strokeAreaBg?: string;
    style?: ViewStyle;
  }

  const DoughnutChart: React.FC<DoughnutChartProps>;
  export default DoughnutChart;
} 