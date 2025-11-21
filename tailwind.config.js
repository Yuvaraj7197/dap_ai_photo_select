/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class="app-dark"]'],
    content: ['./src/**/*.{html,ts,scss,css}', './index.html'],
    plugins: [PrimeUI],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            colors: {
                'custom': {
                    primary: 'var(--custom-primary)',
                    'primary-dark': 'var(--custom-primary-dark)',
                    'primary-light': 'var(--custom-primary-light)',
                    secondary: 'var(--custom-secondary)',
                    accent: 'var(--custom-accent)',
                    success: 'var(--custom-success)',
                    warning: 'var(--custom-warning)',
                    danger: 'var(--custom-danger)',
                    info: 'var(--custom-info)',
                    'bg-primary': 'var(--custom-bg-primary)',
                    'bg-secondary': 'var(--custom-bg-secondary)',
                    'bg-tertiary': 'var(--custom-bg-tertiary)',
                    'bg-dark': 'var(--custom-bg-dark)',
                    'bg-darker': 'var(--custom-bg-darker)',
                    'text-primary': 'var(--custom-text-primary)',
                    'text-secondary': 'var(--custom-text-secondary)',
                    'text-muted': 'var(--custom-text-muted)',
                    'text-light': 'var(--custom-text-light)',
                    'border-light': 'var(--custom-border-light)',
                    'border-medium': 'var(--custom-border-medium)',
                    'border-dark': 'var(--custom-border-dark)',
                }
            }
        }
    }
};
