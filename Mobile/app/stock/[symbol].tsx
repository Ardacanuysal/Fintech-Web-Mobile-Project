import React from 'react';
import { Stack } from 'expo-router';
import StockDetailScreen from '../components/StockDetailScreen';

export default function StockDetail() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Stock Details',
          headerShown: true,
        }}
      />
      <StockDetailScreen />
    </>
  );
} 