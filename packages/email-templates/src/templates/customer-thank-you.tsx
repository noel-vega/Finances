import { Link, Text } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout } from "../components/layout.js";

export interface CustomerThankYouEmailProps {
  firstName: string;
  accountName: string;
  storefrontUrl: string;
}

export function CustomerThankYouEmail({ firstName, accountName, storefrontUrl }: CustomerThankYouEmailProps) {
  return (
    <EmailLayout>
      <Text>Hi {firstName},</Text>
      <Text>Thanks for creating an account with {accountName}. We&apos;re glad you&apos;re here.</Text>
      <Text>
        <Link href={`${storefrontUrl}/products`}>Start shopping</Link>
      </Text>
    </EmailLayout>
  );
}

export default CustomerThankYouEmail;

export function renderCustomerThankYouEmail(props: CustomerThankYouEmailProps): Promise<string> {
  return render(<CustomerThankYouEmail {...props} />);
}
