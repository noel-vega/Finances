import { createFileRoute } from '@tanstack/react-router'
import { PaymentsView } from '../../../features/stripe-connect/views/payments.view'
import { getStripeConnectStatusQueryOptions } from '../../../features/stripe-connect/stripe-connect.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/payments/')({
  staticData: { breadcrumb: 'Payments' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getStripeConnectStatusQueryOptions())
  },
  component: PaymentsView,
})
