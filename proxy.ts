import { clerkMiddleware } from "@clerk/nextjs/server";

const publicPaths = [
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  // API routes authenticate themselves so unauthenticated calls get a 401, not a redirect/404.
  if (!pathname.startsWith("/api/") && !isPublicPath(pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
