import createMiddleware from 'next-intl/middleware';
export default createMiddleware({ locales: ['hu', 'en', 'sk'], defaultLocale: 'hu' });
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
