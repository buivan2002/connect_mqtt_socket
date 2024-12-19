import React from 'react';
import { LineChart } from 'react-native-chart-kit';
import { View, Dimensions } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

const BieudoScreen = () => {
    const route: RouteProp<RootStackParamList, 'bieudo'> = useRoute();

    const  chartData  = route.params; // Nhận dữ liệu từ Home
    console.log(chartData)
  return (
    <View>
      <LineChart
        data={{
          labels: [ "Lần  1","Lần  2", "Lần  3", "Lần  4","Lần  5","Lần  6","Lần  7" ],
          datasets: [
            {
              data: chartData.length > 0 ? chartData : [0, 5, 0, 0, 0, 0, 0],
            },
          ],
        }}
        width={Dimensions.get("window").width} // chiều rộng biểu đồ
        height={220} // chiều cao biểu đồ
        yAxisSuffix=" Độ" // Đơn vị trục Y
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        style={{
          marginVertical: 8,
        }}
      />
    </View>
  );
};

export default BieudoScreen;
