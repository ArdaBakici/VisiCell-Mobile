// Gerekli kütüphaneleri ekle
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  LogBox
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import store from './Store'
import { Provider } from 'react-redux'
import { FlatList, TextInput } from "react-native-gesture-handler";
import { useSelector, useDispatch } from 'react-redux'
import { addData, setData, resetData } from './reducers/dataSlice'
import { increment, decrement, setAmount, reset } from './reducers/progressSlice'
import { addPhoto, setArray, resetArray } from "./reducers/photoSlice";
import { setDilution, resetDilution } from "./reducers/dilutionSlice"
import { changeLang, changeServerIp } from "./reducers/SettingsSlice"
import axios from "axios";
import FlashMessage, {showMessage, hideMessage} from "react-native-flash-message";
import I18n from "./lang/_i18n";
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist'


LogBox.ignoreLogs([
  "[react-native-gesture-handler] Seems like you\'re using an old API with gesture components, check out new Gestures system!",
]);

// Navigasyon için Navigator objelerini oluştur
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

let persistor = persistStore(store);

// Analiz sayfası, yükleme sayfası ve sonuç sayfasından oluşan bir navigasyon katmanı oluştur
const AnalyzeStack = () => {
  return (
    <Stack.Navigator screenOptions={({ route }) => ({
      headerShown: false,
    })}>
      <Stack.Screen name="Analyze" component={AnalyzeScreen} />
      <Stack.Screen name="Loading Screen" component={LodingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

//Yükleme ekranı
const LodingScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const assets = useSelector((state) => state.photo);
  let maxFileNum = assets.length; // Gönderilecek dosya sayısı
  const ip = useSelector((state) => state.settings).server_ip + "/api";
  let source = axios.CancelToken.source();
  const _lang = useSelector((state) => state.settings).lang;

  const componentWillUnmount = () => {
    if (source) {
      source.cancel("Unmounted");
      console.log("Unmounted")
    }
  };

  // Dosya gönderme fonksiyonu
  const sendDataWPromise = async () => {
    // Saklı tutulan değişkenleri sıfırla
    dispatch(resetData());
    dispatch(reset());

    //Tüm fotoğrafları aynı anda paralel olarak sunucuya gönder
    Promise.all(assets.map(current_asset => {
      let formData = new FormData(); // FormData objesi oluştur
      // Fotoğrafı ekle
      console.log(current_asset.uri);
      formData.append("photo", { uri: current_asset.uri, name: 'image.jpg', type: current_asset.type });
      console.log(formData);
      // Web sitesine POST isteği ile gönder
      return axios.post(ip, formData , {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          cancelToken: source.token,
        }).then(res => {
          dispatch(addData(res.data)); // Alınan sonuçları değişkende sakla
          dispatch(increment()); // İlerleme barını 1 artır
        });
    })).then(() => navigation.navigate('Results')).catch(err => {
      console.log(err); // Hata ile karşılaşırsak hatayı yazdır
      if (err.message != "Unmounted"){
        showMessage({
          message: I18n.t("no_server", {locale: _lang}),
          type: "danger",
        });
        navigation.navigate('Analyze')
      }
    }); // Tüm fotoğraflar işlendikten sonra kullanıcıyı sonuç ekranına yönlendir
  };
  
  useEffect(() => {
    sendDataWPromise();
    return () => {
      componentWillUnmount();
    }
  }, []); // Dosya gönderme fonksiyonunu çalıştır

  return (
    <SafeAreaView>
      <StatusBar barStyle="light-content" />
      <View style={{padding: 10, marginTop:30}}>
        <View style={{flexDirection: "row"}}>
            <View style={{flex: 4, margin: 5, alignItems: "flex-end"}}>
              <Image style={{width: 50, height: 50}} source={require('./cell_eye.png')} />
            </View>
            <View style={{flex: 5, margin: 5, alignItems: "flex-start"}}>
              <Text style={{textAlign: "left", fontSize: 30, color: "white"}}>VisiCell</Text>
            </View>
          </View>
        <View style={{marginTop:200, alignItems:"center"}}>
          <ActivityIndicator size="large" color="#fa5334"/>
        </View>
        <View style={{marginTop:20, alignItems:"center"}}>
          <Text style={styles.load_text}> {I18n.t("analyzing", {locale: _lang})} {(useSelector((state) => state.progress)).value} / {maxFileNum} </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Sonuç ekranında gösterilen her bir fotoğraf
const Item = ({ res_data }) => {
  let dilutionValue = useSelector((state) => state.dilution) // Seyreltme faktörünü al
  const _lang = useSelector((state) => state.settings).lang;
  const win = Dimensions.get('window');
  let width = res_data.img_width; 
  let height = res_data.img_height;
  const ratio = win.width/width;
  let alive_cell = res_data.alive
  let dead_cell = res_data.dead
  let total_cell = alive_cell + dead_cell
  if(dilutionValue > 0){ // Eğer seyreltme faktörü girildiyse
    return(
      <View style={{margin: 10}}>
        <View style={{alignItems:"center",  margin:10}}>
          <Image style={{width:win.width, height:ratio*height}} source={{uri: `data:image/png;base64,${res_data.img}`}} />
        </View>
        <View style={{alignItems: "center"}}>
          <Text style={styles.result_text}> {I18n.t("live_cell", {locale: _lang})} {alive_cell}</Text>
          <Text style={styles.result_text}> {I18n.t("dead_cell", {locale: _lang})} {dead_cell}</Text>
          <Text style={styles.result_text}> {I18n.t("total_cell", {locale: _lang})} {total_cell}</Text>
        </View>
        <View style={{alignItems: "center"}}>
          <Text style={styles.result_text}> {I18n.t("cell_viability", {locale: _lang})} {((alive_cell/(total_cell == 0 ? 1:total_cell))*100).toFixed(2)}</Text>
        </View>
        <View style={{alignItems: "center"}}>
          <Text style={styles.result_text}> {alive_cell*dilutionValue*10000} {I18n.t("alive_ml", {locale: _lang})}</Text>
          <Text style={styles.result_text}> {dead_cell*dilutionValue*10000} {I18n.t("dead_ml", {locale: _lang})}</Text>
          <Text style={styles.result_text}> {total_cell*dilutionValue*10000} {I18n.t("total_ml", {locale: _lang})}</Text>
        </View>
      </View>)
  }
  else{ // Eğer seyreltme faktörü girilmediyse
    return(
      <View style={{margin: 10}}>
        <View style={{alignItems:"center", marginBottom:10}}>
        <Image style={{width:win.width, height:ratio*height}} source={{uri: `data:image/png;base64,${res_data.img}`}} />
        </View>
        <View style={{alignItems: "center"}}>
          <Text style={styles.result_text}> {I18n.t("live_cell", {locale: _lang})} {alive_cell}</Text>
          <Text style={styles.result_text}> {I18n.t("dead_cell", {locale: _lang})} {dead_cell}</Text>
          <Text style={styles.result_text}> {I18n.t("total_cell", {locale: _lang})} {total_cell}</Text>
        </View>
        <View style={{alignItems: "center"}}>
          <Text style={styles.result_text}> {I18n.t("cell_viability", {locale: _lang})} {((alive_cell/(total_cell == 0 ? 1:total_cell))*100).toFixed(2)}</Text>
        </View>
      </View>)
  }
};

// Sonuçlar sayfası
const ResultsScreen = ({ route, navigation }) => {
  const resultData = useSelector((state) => state.result) 
  const renderItem = ({ item }) => (
    <Item res_data={item} />
  );
  return (
    <SafeAreaView>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={resultData}
        renderItem={renderItem}
      >
      </FlatList>
    </SafeAreaView>
  );
};

const SettingsScreen = ({ navigation }) => {
  const default_ip = useSelector((state) => state.settings).server_ip;
  const _lang = useSelector((state) => state.settings).lang;
  const dispatch = useDispatch();
  return (
    <SafeAreaView style={{flex:1}}>
      <StatusBar barStyle="light-content" />
      <View style={{padding: 10, marginTop:30}}>
        <View style={{flexDirection: "row"}}>
          <View style={{flex: 4, margin: 5, alignItems: "flex-end"}}>
            <Image style={{width: 50, height: 50}} source={require('./cell_eye.png')} />
          </View>
          <View style={{flex: 5, margin: 5, alignItems: "flex-start"}}>
            <Text style={{textAlign: "left", fontSize: 30, color: "white"}}>VisiCell</Text>
          </View>
        </View>
        <View style={{justifyContent:"center", marginTop:20}}>
          <Text style={styles.result_text}> {I18n.t("server_ip", {locale: _lang})}</Text>
        </View>
        <View style={{marginTop:10}}>
          <TextInput style={styles.text_input} onChangeText={ (value) => dispatch(changeServerIp(value)) } defaultValue={ default_ip }/>
        </View>
        <View style={{justifyContent:"center", marginTop:40}}>
          <Text style={styles.result_text}> {I18n.t("change_lang", {locale: _lang})} </Text>
        </View>
        <View style={{marginTop: 10, flexDirection: "row"}}>
          <View style={{margin: 10, flex: 1}}>
            <TouchableOpacity style={styles.lang_button} onPress={() => {I18n.locale = "en"; dispatch(changeLang("en"));}}>
              <Text style={styles.lang_text}>English</Text>
            </TouchableOpacity>
          </View>
          <View style={{margin: 10, flex: 1}}>
            <TouchableOpacity style={styles.lang_button} onPress={() => {I18n.locale = "tr"; dispatch(changeLang("tr"));}}>
              <Text style={styles.lang_text}>Türkçe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Ana Sayfa
const AnalyzeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const _lang = useSelector((state) => state.settings).lang;
  // Kullanıcının galeriden seçtiği ve kameradan çektiği fotoğrafları değişkene kaydet
  const handleImagePicker = (response) => {
    dispatch(resetArray());
    if (response.didCancel) {
      console.log('User cancelled image picker');
    }
    else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.error);
    }
    else {
      for (let i = 0; i < response.assets.length; i++) {
        dispatch(addPhoto({ uri: response.assets[i].uri, width: response.assets[i].width, height: response.assets[i].height, type: response.assets[i].type }));
      }
    }
  };
  // Sayfanın yukarısındaki kaç adet fotoğraf seçildiğini gösteren bileşen
  const Notify_text = () => {
    let photo_num = useSelector((state) => state.photo).length;
    if (photo_num > 0) {
      return ( <Text style={styles.notify_text}>{photo_num} {I18n.t("photos_selected", {locale: _lang})}</Text>)
    }
    else{
      return(<Text style={styles.notify_text}> {I18n.t("no_photos_selected", {locale: _lang})}</Text>)
    }
  }
  
  return (
    <SafeAreaView style={{flex:1}}>
      <StatusBar barStyle="light-content" />
      <View style={{padding: 10, marginTop:30}}>
        <View style={{flexDirection: "row"}}>
          <View style={{flex: 4, margin: 5, alignItems: "flex-end"}}>
            <Image style={{width: 50, height: 50}} source={require('./cell_eye.png')} />
          </View>
          <View style={{flex: 5, margin: 5, alignItems: "flex-start"}}>
            <Text style={{textAlign: "left", fontSize: 30, color: "white"}}>VisiCell</Text>
          </View>
        </View>
        <View style={{justifyContent:"center", marginTop:20}}>
          <Notify_text/>
        </View>
        <View style={{marginTop: 50, flexDirection: "row"}}>
          <View style={{margin: 10, flex: 1}}>
            <TouchableOpacity style={styles.analyze_button} onPress={() => {
                launchCamera({ mediaType: 'photo', selectionLimit: 0, }, handleImagePicker);}}>
              <Text style={styles.button_text}>{I18n.t("take_photo", {locale: _lang})}</Text>
            </TouchableOpacity>
          </View>
          <View style={{margin: 10, flex: 1}}>
            <TouchableOpacity style={styles.analyze_button} onPress={() => {
                launchImageLibrary({ mediaType: 'photo', selectionLimit: 0, }, handleImagePicker);}}>
              <Text style={styles.button_text}>{I18n.t("select_gallery", {locale: _lang})}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{marginTop:50}}>
          <TextInput keyboardType="number-pad" style={styles.text_input} onChangeText={ (value) => dispatch(setDilution(value)) } placeholder={I18n.t("dilution_factor", {locale: _lang})}/>
        </View>
        <View style={{margin:20, marginTop:100, alignItems: "center"}}>
          <TouchableOpacity style={styles.main_button} onPress={() => {navigation.navigate('Loading Screen')}}>
            <Text style={styles.button_analyz_text}>{I18n.t("analyze", {locale: _lang})}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Ana uygulama fonksiyonu
function App() {
  const _lang = useSelector((state) => state.settings).lang;
  return (
    <NavigationContainer theme={AppTheme}>
      <Tab.Navigator screenOptions={({ route }) => ({
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: 'black', borderTopColor: 'black', height: 60, paddingBottom: 10 },
        headerShown: false,
      })}>
        <Tab.Screen name="AnalyzeStack" component={AnalyzeStack} options={{
          title: I18n.t("analyze_menu", {locale: _lang}),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="biotech" size={size} color={color} />
          )
        }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{
          title: I18n.t("settings", {locale: _lang}),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Redux kütüphanesini uygulamaya ekle
const AppWrapper = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        <FlashMessage position="top" />
      </PersistGate>
    </Provider>
  )
}

// Uygulamanın teması
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'black',
  },
};

// Gösterilen bileşenler için stil tablosu
const styles = StyleSheet.create({
  analyze_button: {
    fontSize: 50,
    padding:10,
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: "#fa5334",
  },
  lang_button: {
    fontSize: 50,
    padding:10,
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: "#6534fa",
  },
  main_button: {
    fontSize: 50,
    padding:10,
    width:200,
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: "#fa5334",
  },
  lang_text:{
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
  },
  button_text: {
    fontSize: 15,
    fontWeight: "bold",
  },
  button_analyz_text:{
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    backgroundColor: 'black',
  },
  load_text: {
    fontSize: 20,
    textAlign: "center",
  },
  load_bar: {

  },
  notify_text: {
    textAlign: 'center',
    fontSize: 15,
  },
  text_input: {
    textAlign: 'center',
    backgroundColor: "#262626",
    borderRadius: 100,
  },
})

export default AppWrapper;