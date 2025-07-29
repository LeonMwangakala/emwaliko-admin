import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div
          className="items-center hidden w-full h-full lg:w-1/2 bg-cover bg-center lg:grid"
          style={{ backgroundImage: "url('/images/bg-image/signIn-img.jpg')" }}
        >
          <div className="relative flex items-center justify-center z-1 w-full h-full">
            {/* White overlay */}
            <div className="absolute inset-0 bg-white/85"></div>
            {/* Content above overlay */}
            <div className="relative z-10 flex flex-col items-center max-w-xs">
              <GridShape />
              <Link to="/" className="block mb-4">
                <img
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-700 dark:text-white/80">
              Invite. Connect. Celebrate. All in One Seamless Experience
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
