import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

interface AdminContextType {
    isAdmin: boolean;
    isLoading: boolean;
    categories: Category[];
    refreshCategories: () => Promise<void>;
}

export interface Category {
    id: number;
    name: string;
    icon: string;
    created_at: string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

interface AdminProviderProps {
    children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    // Check admin status
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            try {
                console.log('AdminContext: Checking status for user', user.email);
                const { data, error, status } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                console.log('AdminContext: Supabase response', { status, data, error });

                if (error) {
                    console.error('AdminContext: Error fetching profile:', error);
                    // If error is 406 (Not Acceptable) or 500, it might be RLS or schema
                    setIsAdmin(false);
                } else {
                    const adminStatus = data?.is_admin || false;
                    console.log('AdminContext: Admin status resolved to:', adminStatus);
                    setIsAdmin(adminStatus);
                }
            } catch (error) {
                console.error('AdminContext: Exception checking status:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    // Load categories
    const refreshCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    useEffect(() => {
        refreshCategories();
    }, []);

    return (
        <AdminContext.Provider value={{ isAdmin, isLoading, categories, refreshCategories }}>
            {children}
        </AdminContext.Provider>
    );
};
