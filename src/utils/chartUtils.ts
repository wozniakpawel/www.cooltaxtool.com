import type { ApexOptions } from 'apexcharts';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterPrecise = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);
export const formatCurrencyPrecise = (value: number) => currencyFormatterPrecise.format(value);
export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const getChartTheme = (theme: string) => {
  const isDark = theme === 'dark';
  return {
    isDark,
    axisColor: isDark ? '#a7b8ac' : '#596b60',
    gridColor: isDark ? '#34453b' : '#e4e9e2',
    backgroundColor: isDark ? '#1d2b25' : '#fff',
    textColor: isDark ? '#e7eee8' : '#243c34',
  };
};

export const getApexChartOptions = (
  theme: string,
  { isPercentage = false, xAxisTitle = '', yAxisTitle = '' } = {},
): ApexOptions => {
  const { isDark, axisColor, gridColor, textColor } = getChartTheme(theme);

  return {
    // Dense sweeps need hover values, not a label on every sampled point.
    dataLabels: { enabled: false },
    noData: { text: 'Select a measure to display.' },
    chart: {
      type: 'line' as const,
      background: 'transparent',
      fontFamily: 'IBM Plex Sans, sans-serif',
      foreColor: axisColor,
      toolbar: {
        show: false,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: 'xy',
        autoScaleYaxis: true,
      },
      animations: {
        enabled: false,
      },
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    stroke: {
      curve: 'straight',
      width: 2,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: axisColor,
        },
        formatter: (_val: string) => formatCurrency(Number(_val)),
      },
      axisBorder: {
        color: axisColor,
      },
      axisTicks: {
        color: axisColor,
      },
      title: {
        text: xAxisTitle,
        style: {
          color: axisColor,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: axisColor,
        },
        formatter: (value: number) => (isPercentage ? formatPercent(value) : formatCurrency(value)),
      },
      min: undefined,
      max: undefined,
      title: {
        text: yAxisTitle,
        style: {
          color: axisColor,
        },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
        formatter: (value: number) => `Gross: ${formatCurrency(value)}`,
      },
      y: {
        formatter: (value: number) => (isPercentage ? formatPercent(value) : formatCurrency(value)),
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: textColor,
      },
      onItemClick: {
        toggleDataSeries: true,
      },
      onItemHover: {
        highlightDataSeries: true,
      },
    },
    markers: {
      size: 0,
    },
  };
};
