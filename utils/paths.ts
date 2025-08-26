// Firebase path helpers
export const roomPath = (code: string) => `rooms/${code}`;
export const slidePath = (code: string, index: number) => `${roomPath(code)}/slides/slide_${index + 1}`;
export const aggregatesPath = (code: string, index: number) => `${roomPath(code)}/aggregates/slide_${index + 1}`;
export const votesPath = (code: string, index: number, anonId: string) => `${roomPath(code)}/votes/slide_${index + 1}/${anonId}`;
export const liveCommentPath = (code: string, index: number) => `${roomPath(code)}/liveComment/slide_${index + 1}`;
export const commentsPath = (code: string) => `${roomPath(code)}/comments`;
export const slideIndexPath = (code: string) => `${roomPath(code)}/slideIndex`;
