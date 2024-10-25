import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Image, TextInput } from 'react-native';
import socket from '../client/socketio'
const SmartHomeScreen = () => {
  const [isLightOn, setIsLightOn] = React.useState(false);
  const [text1, setText1] = useState("Light Control");
  const [text2, setText2] = useState("Temperature");
  const [text3, setText3] = useState("Humidity");

  const toggleSwitch = () => setIsLightOn(previousState => !previousState);
  useEffect(() => {
    socket.initializeSocket();
    socket.on('mqtt_message', (data) => {
      console.log(`Message from MQTT: ${data.message} on topic: ${data.topic}`);
      setText1(data.message)
  });
  
  } , []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmymXvmxcHP8ppB2lQWXJQVMKe_Dg__j7Tcg&s' }} // Logo PTIT (thay thế URL ảnh của bạn)
          style={styles.logo}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Light Control */}
        <View style={styles.row}>
          <Image
            source={{ uri: 'https://book365.vn/upload/thu_vien_anh/bong-den.png' }} // Thay URL bằng URL của bạn
            style={styles.image}
          />
          <View style={styles.textWrapper}>
            <Text style={styles.text}>{text1}</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isLightOn ? "#f5dd4b" : "#f4f3f4"}
              onValueChange={toggleSwitch}
              value={isLightOn}
            />
          </View>
        </View>

        {/* Temperature */}
        <View style={styles.row}>
          <Image
            source={{ uri: 'https://media.istockphoto.com/id/1342059666/vi/vec-to/icon-l%C3%A0-nhi%E1%BB%87t-k%E1%BA%BF-m%C3%A0u-%C4%91%E1%BB%8F-d%E1%BA%A5u-hi%E1%BB%87u-c%E1%BB%A7a-nhi%E1%BB%87t-%C4%91%E1%BB%99-cao-l%C3%A0-ng%E1%BB%A7-tr%C6%B0a-n%C3%B3ng.jpg?s=612x612&w=0&k=20&c=2O05R2N6Pqd41rXLHKn6uomHLyN_dRkCggHDXeF5Ap0=' }} // Thay URL bằng URL của bạn
            style={styles.image}
          />
          <View style={styles.textWrapper}>

          <Text
            style={styles.text}
            >{text1}</Text>
           
          
          </View>

        </View>

        {/* Humidity */}
        <View style={styles.row}>
          <Image
            source={{ uri: 'https://img.lovepik.com/element/45004/1834.png_860.png' }} // Thay URL bằng URL của bạn
            style={styles.image}
          />
          <View style={styles.textWrapper}>

          <TextInput
            style={styles.text}
            onChangeText={setText3}
            value={text3} // Hiển thị đoạn text có thể thay đổi
          />
        </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3D3D3', // Màu nền đỏ nhạt
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row', // Sắp xếp hình ảnh và text theo hàng ngang
    alignItems: 'center',
    marginBottom: 20,
    width: '80%', // Đảm bảo tất cả các phần tử trong hàng đều có cùng chiều rộng
    justifyContent: 'space-between', // Căn giữa nội dung
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 20, // Khoảng cách giữa ảnh và text
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    width: 150,
  },
  textWrapper: {
    flex: 1, // Đảm bảo rằng switch và text căn đều nhau theo chiều ngang
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default SmartHomeScreen;
