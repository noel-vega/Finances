import { Link, Text } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout } from "../components/layout.js";

export interface StaffInviteEmailProps {
  firstName: string;
  inviteUrl: string;
}

export function StaffInviteEmail({ firstName, inviteUrl }: StaffInviteEmailProps) {
  return (
    <EmailLayout>
      <Text>Hi {firstName},</Text>
      <Text>You&apos;ve been added as a user on Harbor. Click below to set your password and get started.</Text>
      <Text>
        <Link href={inviteUrl}>Set your password</Link>
      </Text>
    </EmailLayout>
  );
}

export default StaffInviteEmail;

export function renderStaffInviteEmail(props: StaffInviteEmailProps): Promise<string> {
  return render(<StaffInviteEmail {...props} />);
}
