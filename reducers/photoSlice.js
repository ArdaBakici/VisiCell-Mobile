// Bu redux değişkeni kullanıcının seçtiği fotoğrafları tutar
import { createSlice } from '@reduxjs/toolkit'

export const photoSlice = createSlice({
  name: 'photo',
  initialState: [],
  reducers: {
    addPhoto: (state, action) => {
        state.push(action.payload)
    },
    setArray: (state, action) => {
        return action.payload
    },
    resetArray: (state, action) => {
        return [];
    },
  },
})

export const { addPhoto, setArray, resetArray } = photoSlice.actions

export default photoSlice.reducer