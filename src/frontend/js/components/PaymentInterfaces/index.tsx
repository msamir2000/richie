import { lazy, Suspense, useEffect } from 'react';
import * as Joanie from 'types/Joanie';
import { handle } from 'utils/errors/handle';
import { PaymentErrorMessageId } from 'components/PaymentButton';

const LazyPayplugLightbox = lazy(() => import('./PayplugLightbox'));

export interface PaymentProviderInterfaceProps extends Joanie.Payment {
  onSuccess: () => void;
  onError: (messageId: PaymentErrorMessageId) => void;
}

/**
 * In charge of rendering the right payment interface according to the
 * `provider` property. Return null if the provider is not supported.
 */
const PaymentProvider = (props: PaymentProviderInterfaceProps) => {
  const isNotImplementedProvider = !Object.values<string>(Joanie.PaymentProviders).includes(
    props.provider,
  );

  useEffect(() => {
    if (isNotImplementedProvider) {
      props.onError(PaymentErrorMessageId.ERROR_DEFAULT);
      const error = new Error(`Payment provider ${props.provider} not implemented`);
      handle(error);
    }
  }, [props]);

  if (isNotImplementedProvider) return null;

  return (
    <Suspense fallback={null}>
      {props.provider === Joanie.PaymentProviders.PAYPLUG && <LazyPayplugLightbox {...props} />}
    </Suspense>
  );
};

export default PaymentProvider;
