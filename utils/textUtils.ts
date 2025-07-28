export const formatModelName = (name: string): string => {
    if (!name) return '';
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};
