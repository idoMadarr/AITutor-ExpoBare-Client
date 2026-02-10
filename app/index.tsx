import { connect } from '@/utils/connect';
import { Colors } from '@/utils/palette';
import axios from 'axios';
import { useFonts } from 'expo-font';
import { navigate } from 'expo-router/build/global-state/routing';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const splash = () => {
  const [loaded, _error] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
  });

  useEffect(() => {
    init();
  }, [loaded]);

  const init = () => {
    if (loaded) {
      setTimeout(async () => {
        const res = await axios.get(`${connect}/awake_server`);
        if (res) navigate('/main');
      }, 2500);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'light-content'} backgroundColor={Colors.black} />
      <ActivityIndicator size={'large'} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
});

export default splash;
