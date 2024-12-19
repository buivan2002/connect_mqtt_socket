import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import SmartHomeScreen from '../../reviews/SmartHomeScreen';
import BieudoScreen from '../../reviews/bieudonhietdo';
import Doamscreen from '../../reviews/doam';

// HomeLayout nhận navigation và route từ Tab.Screen mà không cần khai báo kiểu
const AppNavigation = ({ navigation, route }: any) => { // Thay { navigation, route }: HomeLayoutProps thành any
  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="home"
        component={SmartHomeScreen}
        options={{headerShown: false}}
      />
    
    <Stack.Screen
        name="bieudo"
        component={BieudoScreen}
        options={{headerShown: true}}
      />
       
    <Stack.Screen
        name="doam"
        component={Doamscreen}
        options={{headerShown: true}}
      />
    </Stack.Navigator>
  );
};
export default AppNavigation;
