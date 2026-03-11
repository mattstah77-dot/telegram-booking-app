import { create } from 'zustand';

/**
 * Store для состояния бронирования
 */
const useBookingStore = create((set, get) => ({
  // Выбранная услуга
  selectedService: null,

  // Выбранная дата
  selectedDate: null,

  // Выбранное время
  selectedTime: null,

  // Данные клиента
  customerData: {
    name: '',
    phone: '',
  },

  // Статус
  status: 'idle', // idle | loading | success | error
  error: null,

  // Actions
  setSelectedService: (service) => set({ selectedService: service }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setSelectedTime: (time) => set({ selectedTime: time }),

  setCustomerData: (data) =>
    set((state) => ({
      customerData: { ...state.customerData, ...data },
    })),

  setStatus: (status, error = null) => set({ status, error }),

  reset: () =>
    set({
      selectedService: null,
      selectedDate: null,
      selectedTime: null,
      customerData: { name: '', phone: '' },
      status: 'idle',
      error: null,
    }),

  // Getters
  getBookingData: () => {
    const state = get();
    return {
      serviceId: state.selectedService?.id,
      date: state.selectedDate,
      time: state.selectedTime,
      customerName: state.customerData.name,
      customerPhone: state.customerData.phone,
    };
  },

  isValid: () => {
    const state = get();
    return (
      state.selectedService &&
      state.selectedDate &&
      state.selectedTime &&
      state.customerData.name.trim().length >= 2 &&
      state.customerData.phone.trim().length >= 10
    );
  },
}));

export default useBookingStore;
