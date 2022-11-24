// Bu redux değişkeni sunucudan alınan sonuçları tutar
import { createSlice } from '@reduxjs/toolkit'

export const resultSlice = createSlice({
  name: 'result',
  initialState: [],
  reducers: {
    addData: (state, action) => {
        state.push(action.payload)
    },
    setData: (state, action) => {
        return action.payload
    },
    resetData: (state, action) => {
        return [];
    },
  },
})

export const { addData, setData, resetData } = resultSlice.actions

export default resultSlice.reducer