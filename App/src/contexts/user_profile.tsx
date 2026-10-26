'use client';

import { createContext, useContext } from 'react';

export type UserProfileType = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    postal_code: string;
    account_type: string;
    avatar_url: string;
};

const UserProfileContext = createContext<UserProfileType | null>(null);
const SetUserProfileContext = createContext<(userProfile: UserProfileType) => void>(() => {});

export function useUserProfile() {
    return useContext(UserProfileContext);
}

export function useSetUserProfile() {
    return useContext(SetUserProfileContext);
}

export function UserProfileProvider({
    userProfile,
    setUserProfile,
    children,
}: {
    userProfile: UserProfileType | null;
    setUserProfile: (userProfile: UserProfileType) => void;
    children: React.ReactNode;
}) {
    return (
        <UserProfileContext.Provider value={userProfile}>
            <SetUserProfileContext.Provider value={setUserProfile}>
                {children}
            </SetUserProfileContext.Provider>
        </UserProfileContext.Provider>
    );
}
