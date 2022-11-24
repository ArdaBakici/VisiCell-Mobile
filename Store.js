import { configureStore } from '@reduxjs/toolkit'
import resultReducer from './reducers/dataSlice'
import progressReducer from './reducers/progressSlice'
import photoSlice from './reducers/photoSlice'
import dilutionSlice from './reducers/dilutionSlice'
import SettingsSlice from './reducers/SettingsSlice'
import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage';
import thunk from 'redux-thunk'

const reducers = combineReducers({
  result: resultReducer,
  progress: progressReducer,
  photo: photoSlice,
  dilution : dilutionSlice,
  settings : SettingsSlice,
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['settings']
};

const persistedReducer = persistReducer(persistConfig, reducers);

export default configureStore({
  reducer: persistedReducer,
  middleware: [thunk]
})