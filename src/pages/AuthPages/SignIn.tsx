import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="KadiRafiki | Sign In"
        description="Event Invitation Card Management System"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
