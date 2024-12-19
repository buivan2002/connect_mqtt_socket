import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import socket from '../socketio';
import { useNavigation, NavigationProp } from '@react-navigation/native';

const SmartHomeScreen = () => {
  const navigation: NavigationProp<any> = useNavigation();

  // State cho dữ liệu từng phần
  const [text1, setText1] = useState('Light Control');
  const [text2, setText2] = useState();
  const [text4, setText4] = useState('Độ ẩm đất');
  const [chartData, setChartData] = useState<number[]>([]); // Mảng chartData
  const [chardoam, setchardoam] = useState<number[]>([]); // Mảng chartData

  // Gắn socket listener
  useEffect(() => {
    socket.initializeSocket();

    socket.on('mqtt_message_nhiet', (data: any) => {
      const newValue = parseFloat(data.message); // Chuyển chuỗi thành số

      setText2(data.message);
      if (!isNaN(newValue)) {
        // Thêm số mới vào đầu mảng
        setChartData((prevData) => {
          const updatedData = [...prevData, newValue];

          // Giới hạn mảng có 7 phần tử, nếu có hơn thì cắt bớt
          if (updatedData.length > 7) {
            updatedData.shift();
          }

          return updatedData;
        });
      }
    });

    socket.on('mqtt_message_as', (data: any) => {
      console.log(`Message from MQTT: ${data.message} on topic: ${data.topic}`);
      setText1(data.message === '0' ? 'Sáng' : 'Tối');
    });

    socket.on('mqtt_message_doam', (data: any) => {
      const newValue = parseFloat(data.message); // Chuyển chuỗi thành số
      setText4(data.message);
      if (!isNaN(newValue)) {
        // Thêm số mới vào đầu mảng
        setchardoam((prevData) => {
          const updatedData = [...prevData, newValue];

          // Giới hạn mảng có 7 phần tử, nếu có hơn thì cắt bớt
          if (updatedData.length > 7) {
            updatedData.shift();
          }

          return updatedData;
        });
      }
    });
  }, [text2]);

  // Danh sách dữ liệu giao diện
  const data = [
    {
      id: '1',
      title: text1 ,
      image: 'https://img.lovepik.com/element/45004/1857.png_860.png',
    },
    {
      id: '2',
      title: text2 + " Độ",
      image:'https://media.istockphoto.com/id/1342059666/vi/vec-to/icon-l%C3%A0-nhi%E1%BB%87t-k%E1%BA%BF-m%C3%A0u-%C4%91%E1%BB%8F-d%E1%BA%A5u-hi%E1%BB%87u-c%E1%BB%A7a-nhi%E1%BB%87t-%C4%91%E1%BB%99-cao-l%C3%A0-ng%E1%BB%A7-tr%C6%B0a-n%C3%B3ng.jpg?s=612x612&w=0&k=20&c=2O05R2N6Pqd41rXLHKn6uomHLyN_dRkCggHDXeF5Ap0=',
    },
    {
      id: '3',
      title: text4 +"%",
      image: 'https://png.pngtree.com/png-vector/20221118/ourmid/pngtree-flat-style-humidity-icon-on-white-background-smart-sign-sky-vector-png-image_41380894.jpg',
    },{
      id: '4',
      title: text4 +"%",
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRVoQIy9FqnuDIWuLfO83_l0aEW7qAXthBoQ&s',
    },{
      id: '5',
      title: text4 +"%",
      image: 'https://png.pngtree.com/png-vector/20190223/ourmid/pngtree-vector-charging-fan-icon-png-image_696305.jpg',
    },{
      id: '6',
      title: text4 +"%",
      image: 'https://img.lovepik.com/element/40142/2240.png_1200.png',
    },{
      id: '7',
      title: text4 +"%",
      image: 'https://media.istockphoto.com/id/1350207672/vi/vec-to/bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-b%C3%B3ng-%C4%91%C3%A8n-vector-ph%C3%A1t-s%C3%A1ng-minh-h%E1%BB%8Da-%C3%A1nh-s%C3%A1ng.jpg?s=612x612&w=0&k=20&c=3Vcel7x-wYM4st0bwq6eS_XQjkZCeVgjUt0uHIrRNko=',
    },
  ];

  // Render từng phần tử
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
    onPress={
      item.id === '2' 
        ? () => navigation.navigate('bieudo',  chartData ) 
        : item.id === '3' 
        ? () => navigation.navigate('doam', chardoam) 
        : undefined
    }
    >
      <View style={styles.row}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.textWrapper}>
          <Text style={styles.text}>{item.title} </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmymXvmxcHP8ppB2lQWXJQVMKe_Dg__j7Tcg&s',
          }}
          style={styles.logo}
        />
      </View>

      {/* Sử dụng FlatList */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3D3D3',
    alignItems: 'center',
  },
  header: {
    paddingTop: 40,
    alignItems: 'flex-end',
    width: '100%',
    paddingRight: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
    justifyContent: 'space-between',
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 20,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SmartHomeScreen;
