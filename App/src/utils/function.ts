export function validRequestStatus(status: number) {
    return status >= 200 && status < 300;
}
