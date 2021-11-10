import { Fragment, useEffect, useMemo, useState, useRef } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import * as Joanie from 'types/Joanie';
import { Maybe } from 'types/utils';
import { usePayment } from 'hooks/usePayment';
import { useCourse } from 'data/CourseProductsProvider';
import { Spinner } from 'components/Spinner';
import PaymentInterface from 'components/PaymentInterfaces';
import API from 'utils/api/joanie';

const messages = defineMessages({
  pay: {
    defaultMessage: 'Pay {price}',
    description: 'CTA label to proceed of the product',
    id: 'components.SaleTunnelStepPayment.pay',
  },
  payInOneClick: {
    defaultMessage: 'Pay in one click {price}',
    description: 'CTA label to proceed of the product',
    id: 'components.SaleTunnelStepPayment.payInOneClick',
  },
  errorDefault: {
    defaultMessage: 'An error occured during payment. Please retry later.',
    description: 'Error message shown when payment creation request failed.',
    id: 'components.SaleTunnelStepPayment.errorDefault',
  },
  errorAbort: {
    defaultMessage: 'You have aborted the payment.',
    description: 'Error message shown when user aborts the payment.',
    id: 'components.SaleTunnelStepPayment.errorAbort',
  },
});

export enum PaymentErrorMessageId {
  ERROR_DEFAULT = 'errorDefault',
  ERROR_ABORT = 'errorAbort',
}

interface PaymentButtonProps {
  product: Joanie.Product;
  billingAddress: Maybe<Joanie.Address>;
  creditCard: Maybe<Joanie.CreditCard['id']>;
  onSuccess: () => void;
  // ? onFailed
}

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

/**
 * Displays a button to proceed to the payment.
 * First it creates the payment from Joanie then displays the payment interface
 * or the error message.
 */
const PaymentButton = ({ product, billingAddress, creditCard, onSuccess }: PaymentButtonProps) => {
  const intl = useIntl();
  const intervalRef = useRef<NodeJS.Timeout>();
  const { item: course } = useCourse();
  const paymentManager = usePayment();

  const isReadyToPay = useMemo(() => {
    return course?.code && product.id && billingAddress;
  }, [product, course, billingAddress]);

  const [payment, setPayment] = useState<Joanie.Payment | Joanie.PaymentOneClick>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<PaymentErrorMessageId>(PaymentErrorMessageId.ERROR_DEFAULT);

  /**
   * Use Joanie API to retrieve an order and check if it's state is validated
   *
   * @param {string} id - Order id
   * @returns {Promise<boolean>} - Promise resolving to true if order is validated
   */
  const isOrderValidated = async (id: string): Promise<Boolean> => {
    const order = await API().user.orders.get(id);
    return order?.state === Joanie.OrderState.VALIDATED;
  };

  /** type guard to check if the payment is a payment one click */
  const isOneClickPayment = (p: typeof payment): p is Joanie.PaymentOneClick =>
    (p as Joanie.PaymentOneClick)?.is_paid === true;

  const createPayment = async () => {
    if (isReadyToPay) {
      setState(ComponentStates.LOADING);
      let paymentInfos = payment;

      if (!paymentInfos) {
        try {
          paymentInfos = await paymentManager.methods.create({
            billing_address: billingAddress!,
            product_id: product.id,
            course_code: course!.code,
            credit_card_id: creditCard,
          });
        } catch {
          setState(ComponentStates.ERROR);
        }
      }

      setPayment(paymentInfos);
    }
  };

  const handleSuccess = () => {
    let round = 0;
    intervalRef.current = setInterval(async () => {
      if (round >= 30) {
        paymentManager.methods.abort((payment as Joanie.Payment).payment_id);
        clearInterval(intervalRef.current!);
        intervalRef.current = undefined;
        setState(ComponentStates.ERROR);
      } else {
        const isValidated = await isOrderValidated(payment!.order_id);
        if (isValidated) {
          clearInterval(intervalRef.current!);
          intervalRef.current = undefined;
          setState(ComponentStates.IDLE);
          onSuccess();
        }
      }
      round += 1;
    }, 1000);
  };

  const handleError = (messageId: PaymentErrorMessageId = PaymentErrorMessageId.ERROR_DEFAULT) => {
    setState(ComponentStates.ERROR);
    setError(messageId);
  };

  useEffect(() => {
    if (isOneClickPayment(payment) && state === ComponentStates.LOADING) {
      handleSuccess();
    }
  }, [payment]);

  useEffect(
    () => () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        paymentManager.methods.abort((payment as Joanie.Payment).payment_id);
      }
    },
    [],
  );

  return (
    <div className="payment-button">
      <button
        className="button button--primary"
        disabled={!isReadyToPay || state === ComponentStates.LOADING}
        onClick={createPayment}
      >
        {state === ComponentStates.LOADING ? (
          <Fragment>
            <Spinner />
            {payment && !isOneClickPayment(payment) && (
              <PaymentInterface {...payment} onError={handleError} onSuccess={handleSuccess} />
            )}
          </Fragment>
        ) : (
          <FormattedMessage
            {...(creditCard ? messages.payInOneClick : messages.pay)}
            values={{
              price: intl.formatNumber(product.price, {
                style: 'currency',
                currency: product.price_currency,
              }),
            }}
          />
        )}
      </button>
      {state === ComponentStates.ERROR && (
        <p className="payment-button__error">
          <FormattedMessage {...messages[error]} />
        </p>
      )}
    </div>
  );
};

export default PaymentButton;
