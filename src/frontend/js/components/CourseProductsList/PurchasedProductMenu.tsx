/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Fragment, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useSelect } from 'downshift';
import { handle } from 'utils/errors/handle';
import * as Joanie from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import API from 'utils/api/joanie';

interface Props {
  order: Joanie.OrderLite;
}

const messages = defineMessages({
  downloadInvoice: {
    id: 'components.PurchasedProductMenu.downloadInvoice',
    defaultMessage: 'Download invoice',
    description: 'Label for selector item to download invoice',
  },
});

const PurchasedProductMenu = ({ order }: Props) => {
  const [loading, setLoading] = useState(false);

  const downloadInvoice = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      setLoading(true);
      const $target = event.currentTarget;
      const file = await API().payments.invoice.get(order.id);
      const url = window.URL.createObjectURL(file);
      $target.href = url;
      $target.download = `invoice-${order.id.split('-')[0]}.pdf`;

      const revokeObject = () => {
        window.URL.revokeObjectURL(url);
        $target.removeAttribute('href');
        $target.removeAttribute('download');
        window.removeEventListener('blur', revokeObject);
      };

      window.addEventListener('blur', revokeObject);
      $target.click();
    } catch (error) {
      handle(error);
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'downloadInvoice',
      action: downloadInvoice,
    },
  ];

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({ items });

  const selectorListClasses = useMemo(() => {
    const classList = ['selector__list'];

    if (!isOpen) {
      classList.push('selector__list--is-closed');
    }

    return classList.join(' ');
  }, [loading, isOpen]);

  const selectorItemClasses = (index: Number) => {
    const classList = ['selector__list__link'];

    if (highlightedIndex === index) {
      classList.push('selector__list__link--highlighted');
    }

    return classList.join(' ');
  };

  return (
    <nav className="selector">
      <label {...getLabelProps()} className="offscreen">
        Other actions related to this product
      </label>
      {loading ? (
        <Spinner theme="light" />
      ) : (
        <Fragment>
          <button {...getToggleButtonProps()} className="selector__button">
            <svg role="img" className="selector__button__icon" aria-hidden>
              <use xlinkHref="#icon-three-vertical-dots" />
            </svg>
          </button>
          <ul {...getMenuProps()} className={selectorListClasses}>
            {isOpen &&
              items.map((item, index) => (
                <li key={item.key} {...getItemProps({ item, index })}>
                  <a className={selectorItemClasses(index)} onClick={item.action}>
                    <FormattedMessage {...messages[item.key]} />
                  </a>
                </li>
              ))}
          </ul>
        </Fragment>
      )}
    </nav>
  );
};

export default PurchasedProductMenu;
