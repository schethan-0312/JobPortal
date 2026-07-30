document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('line-chart')) {
      new Morris.Area({
        element: 'line-chart',
        data: [
          { period: '2019', iphone: 50, ipad: 80, itouch: 20 },
          { period: '2020', iphone: 130, ipad: 100, itouch: 80 },
          { period: '2021', iphone: 80, ipad: 60, itouch: 70 },
          { period: '2022', iphone: 70, ipad: 200, itouch: 140 },
          { period: '2023', iphone: 180, ipad: 150, itouch: 140 },
          { period: '2024', iphone: 105, ipad: 100, itouch: 80 },
          { period: '2025', iphone: 250, ipad: 150, itouch: 200 }
        ],
        xkey: 'period',
        ykeys: ['iphone', 'ipad', 'itouch'],
        labels: ['iPhone', 'iPad', 'iPod Touch'],
        pointSize: 3,
        fillOpacity: 0,
        pointStrokeColors: ['#1cc100', '#fdc006', '#1db4bd'],
        behaveLikeLine: true,
        gridLineColor: '#e0e0e0',
        lineWidth: 1,
        hideHover: 'auto',
        lineColors: ['#1cc100', '#fdc006', '#1db4bd'],
        resize: true
      });
    } else {
      console.warn('Morris chart container not found.');
    }
  });