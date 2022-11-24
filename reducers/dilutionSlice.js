// Bu redux değişkeni seyreltme faktörünü tutar
import { createSlice } from '@reduxjs/toolkit'

export const dilutionSlice = createSlice({
  name: 'dilution',
  initialState: 0,
  reducers: {
    setDilution: (state, action) => {
        return action.payload
    },
    resetDilution: (state, action) => {
        return 0;
    },
  },
})

export const { setDilution, resetDilution } = dilutionSlice.actions

export default dilutionSlice.reducer