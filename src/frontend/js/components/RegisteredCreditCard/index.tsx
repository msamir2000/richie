import { useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import * as Joanie from 'types/Joanie';

const messages = defineMessages({
  inputAriaLabel: {
    defaultMessage: "Select {title}'s card",
    description: 'ARIA Label read by screenreader to inform which card is focused',
    id: 'components.RegisteredCreditCard.inputAriaLabel',
  },
  expirationDate: {
    defaultMessage: 'Expiration date: {expirationDate}',
    description: 'Credit card expiration date label',
    id: 'components.RegisteredCreditCard.expirationDate',
  },
});

interface RegisteredCreditCardProps extends Joanie.CreditCard {
  selected: boolean;
  handleSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RegisteredCreditCard = ({
  selected,
  handleSelect,
  ...creditCard
}: RegisteredCreditCardProps) => {
  const intl = useIntl();

  const expirationDate = useMemo(() => {
    const { expiration_month: month, expiration_year: year } = creditCard;
    return intl.formatDate(new Date(year, month - 1, 1), {
      month: '2-digit',
      year: 'numeric',
    });
  }, [creditCard.expiration_month, creditCard.expiration_year]);

  const inputId = useMemo(() => `registered-credit-card-${creditCard.id}`, [creditCard.id]);

  return (
    <label className="registered-credit-card">
      <p className="form-field">
        <input
          aria-label={intl.formatMessage(messages.inputAriaLabel, {
            title: creditCard.title,
          })}
          checked={selected}
          className="form-field__checkbox-input"
          onChange={handleSelect}
          type="checkbox"
          id={inputId}
        />
        <label htmlFor={inputId} className="form-field__label">
          <span className="form-field__checkbox-control">
            <svg role="img" aria-hidden="true">
              <use href="#icon-check" />
            </svg>
          </span>
        </label>
      </p>
      <div className="registered-credit-card__infos">
        <h6 className="registered-credit-card__name">{creditCard.title || creditCard.brand}</h6>
        <p className="registered-credit-card__number">{creditCard.last_numbers}</p>
        <p className="registered-credit-card__validity">
          <FormattedMessage {...messages.expirationDate} values={{ expirationDate }} />
        </p>
      </div>
    </label>
  );
};
