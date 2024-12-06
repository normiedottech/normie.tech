"use client"
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
interface ProvidersProps {
    children: React.ReactNode;
}



const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);
};

export default Providers;