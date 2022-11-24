// Bu redux değişkeni kaç adet fotoğrafın sunucuya yüklendiğini tutar
import { createSlice } from '@reduxjs/toolkit'

const initialState = {value: 0};

export const progressSlice = createSlice({
  name: 'progress',
  initialState: initialState,
  reducers: {
    increment: (state) => {
        state.value += 1;
    },
    decrement: (state) => {
        state.value -= 1;
    },
    setAmount: (state, action) => {
        return {value: action.payload};
    },
    reset: (state) => {
        return initialState;
    },
  },
})
export const { increment, decrement, setAmount, reset } = progressSlice.actions

export default progressSlice.reducer