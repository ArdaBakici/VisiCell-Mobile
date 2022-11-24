// Bu redux değişkeni kaç adet fotoğrafın sunucuya yüklendiğini tutar
import { createSlice } from '@reduxjs/toolkit'

const initialState = {server_ip: "http://192.168.1.102:5000", lang: "tr"};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialState,
  reducers: {
    changeLang: (state, action) => {
        state.lang = action.payload;
    },
    changeServerIp: (state, action) => {
        state.server_ip = action.payload;
    }
  },
})
export const { changeLang, changeServerIp } = settingsSlice.actions

export default settingsSlice.reducer