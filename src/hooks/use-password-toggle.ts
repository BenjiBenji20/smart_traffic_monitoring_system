import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function usePasswordToggle() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    const passwordInputType = isPasswordVisible ? 'text' : 'password';
    const PasswordIcon = isPasswordVisible ? EyeOff : Eye;

    return {
        isPasswordVisible,
        togglePasswordVisibility,
        passwordInputType,
        PasswordIcon
    };
}