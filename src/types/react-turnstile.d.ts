declare module 'react-turnstile' {
    import * as React from 'react';

    interface TurnstileProps {
        sitekey: string;
        onVerify: (token: string) => void;
        onError?: (error: any) => void;
        onExpire?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        style?: React.CSSProperties | object;
        className?: string;
    }

    const Turnstile: React.FC<TurnstileProps>;
    export default Turnstile;
}
