/**
 * Everything to help with CSV generation
 */
export class CSV {
    /**
     * Convert an object to a CSV file and then download it
     */
    static download(data) {
        const rows = [];
        let setHeaders = false;
        let headers = [];
        for (const id in data) {
            const row = data[id];
            if (!setHeaders) {
                headers = Object.keys(row);
                rows.push(headers.join(','));
                setHeaders = true;
            }
            const values = headers.map((header) => JSON.stringify(row[header] || ''));
            rows.push(values.join(','));
        }
        const content = rows.join('\n');
        // Create a Blob and trigger download
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'srating-data.csv';
        // Trigger download and clean up
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }
}
