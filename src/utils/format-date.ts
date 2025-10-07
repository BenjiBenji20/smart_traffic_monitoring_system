export function formatDateWithoutMS(dateInput: string | Date): string {
    if (typeof dateInput === 'string') {
        // If it's already in correct format, return as-is
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        // If missing seconds, add them
        return dateInput.includes(':00') ? dateInput : `${dateInput}:00`;
    }

    // If input is a Date object
    const pad = (num: number) => num.toString().padStart(2, '0');
    const date = new Date(dateInput);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}