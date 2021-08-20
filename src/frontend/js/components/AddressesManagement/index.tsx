import { Fragment, useEffect, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import countries from 'i18n-iso-countries';
import * as Joanie from 'types/Joanie';
import { Maybe } from 'types/utils';
import { confirm } from 'utils/indirection/window';
import { useAddresses } from 'hooks/useAddresses';
import Banner, { BannerType } from 'components/Banner';
import { CheckboxField, SelectField, TextField } from '../Form';
import validationSchema from './validationSchema';

type AddressFormValues = Omit<Joanie.Address, 'id' | 'is_main'> & { save: boolean };

// constant used as `address.id` for local address
export const LOCAL_BILLING_ADDRESS_ID = 'local-billing-address';

const messages = defineMessages({
  registeredAddresses: {
    id: 'components.AddressesManagement.registeredAddresses',
    description: 'Title of the registered addresses block',
    defaultMessage: 'Your addresses',
  },
  addAddress: {
    id: 'components.AddressesManagement.addAddress',
    description: 'Title of the address creation form',
    defaultMessage: 'Add a new address',
  },
  editAddress: {
    id: 'components.AddressesManagement.editAddress',
    description: 'Title of the address edit form',
    defaultMessage: 'Update address {title}',
  },
  titleInputLabel: {
    id: 'components.AddressesManagement.titleInput',
    description: 'Label of the "title" input',
    defaultMessage: 'Address title',
  },
  first_nameInputLabel: {
    id: 'components.AddressesManagement.first_nameInput',
    description: 'Label of the "first_name" input',
    defaultMessage: "Recipient's first name",
  },
  last_nameInputLabel: {
    id: 'components.AddressesManagement.last_nameInput',
    description: 'Label of the "last_name" input',
    defaultMessage: "Recipient's last name",
  },
  addressInputLabel: {
    id: 'components.AddressesManagement.addressInput',
    description: 'Label of the "address" input',
    defaultMessage: 'Address',
  },
  cityInputLabel: {
    id: 'components.AddressesManagement.cityInput',
    description: 'Label of the "city" input',
    defaultMessage: 'City',
  },
  postcodeInputLabel: {
    id: 'components.AddressesManagement.postcodeInput',
    description: 'Label of the "postcode" input',
    defaultMessage: 'Postcode',
  },
  countryInputLabel: {
    id: 'components.AddressesManagement.countryInput',
    description: 'Label of the "country" input',
    defaultMessage: 'Country',
  },
  saveInputLabel: {
    id: 'components.AddressesManagement.saveInput',
    description: 'Label of the "save" input',
    defaultMessage: 'Save this address',
  },
  selectButton: {
    id: 'components.AddressesManagement.selectButton',
    description: 'Label of the select button',
    defaultMessage: 'Use this address',
  },
  selectTitleButton: {
    id: 'components.AddressesManagement.selectTitleButton',
    description: 'Title of the select button',
    defaultMessage: 'Select "{title}" address',
  },
  deleteButton: {
    id: 'components.AddressesManagement.deleteButton',
    description: 'Label of the delete button',
    defaultMessage: 'Delete',
  },
  deleteTitleButton: {
    id: 'components.AddressesManagement.deleteTitleButton',
    description: 'Title of the delete button',
    defaultMessage: 'Delete "{title}" address',
  },
  editButton: {
    id: 'components.AddressesManagement.editButton',
    description: 'Label of the edit button',
    defaultMessage: 'Edit',
  },
  editTitleButton: {
    id: 'components.AddressesManagement.editTitleButton',
    description: 'Title of the edit button',
    defaultMessage: 'Edit "{title}" address',
  },
  cancelButton: {
    id: 'components.AddressesManagement.cancelButton',
    description: 'Label of the cancel button',
    defaultMessage: 'Cancel',
  },
  cancelTitleButton: {
    id: 'components.AddressesManagement.cancelTitleButton',
    description: 'Title of the cancel button',
    defaultMessage: 'Cancel edition',
  },
  closeButton: {
    id: 'components.AddressesManagement.closeButton',
    description: 'Label of the close button',
    defaultMessage: 'Go back',
  },
  updateButton: {
    id: 'components.AddressesManagement.updateButton',
    description: 'Label of the update button',
    defaultMessage: 'Update this address',
  },
  promoteTitleButton: {
    id: 'components.AddressesManagement.promoteTitleButton',
    description: 'Title to the button to set address as main',
    defaultMessage: 'Define "{title}" address as main',
  },
  deletionConfirmation: {
    id: 'components.AddressesManagement.deletionConfirmation',
    description: 'Confirmation message shown to the user when he wants to delete an address',
    defaultMessage:
      'Are you sure you want to delete the "{title}" address ?\n⚠️ You cannot undo this change after.',
  },
  error: {
    id: 'components.AddressesManagement.error',
    description:
      'Error message shown to the user when address creation/update/deletion request fails.',
    defaultMessage: 'An error occured while address {action}. Please retry later.',
  },
  actionCreation: {
    id: 'components.AddressesManagement.actionCreation',
    description: 'Action name for address creation.',
    defaultMessage: 'creation',
  },
  actionUpdate: {
    id: 'components.AddressesManagement.actionUpdate',
    description: 'Action name for address update.',
    defaultMessage: 'update',
  },
  actionDeletion: {
    id: 'components.AddressesManagement.actionDeletion',
    description: 'Action name for address deletion.',
    defaultMessage: 'deletion',
  },
  actionPromotion: {
    id: 'components.AddressesManagement.actionPromotion',
    description: 'Action name for address promotion.',
    defaultMessage: 'promotion',
  },
});

interface AddressesManagementProps {
  handleClose: () => void;
  selectAddress: (address: Joanie.Address) => void;
}

const AddressesManagement = ({ handleClose, selectAddress }: AddressesManagementProps) => {
  const defaultValues = {
    title: '',
    first_name: '',
    last_name: '',
    address: '',
    postcode: '',
    city: '',
    country: '-',
    save: false,
  } as AddressFormValues;

  const { register, handleSubmit, reset, formState } = useForm<AddressFormValues>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  const intl = useIntl();
  const [languageCode] = intl.locale.split('-');
  const countryList = countries.getNames(languageCode);
  const addresses = useAddresses();
  const [editedAddress, setEditedAddress] = useState<Maybe<Joanie.Address>>();
  const [error, setError] = useState<Maybe<string>>();

  /**
   * Sort addresses ascending by title according to the locale
   *
   * @param {Joanie.Address} a
   * @param {Joanie.Address} b
   * @returns {Joanie.Address[]} Sorted addresses ascending by title
   */
  const sortAddressByTitleAsc = (a: Joanie.Address, b: Joanie.Address) => {
    return a.title.localeCompare(b.title, [intl.locale, intl.defaultLocale]);
  };

  /**
   * update `selectedAddress` state with the address provided
   * then close the address management form
   *
   * @param {Joanie.Address} address
   */
  const handleSelect = (address: Joanie.Address) => {
    setError(undefined);
    selectAddress(address);
    handleClose();
  };

  /**
   * Ask user to confirm its intention
   * then make the request to delete the provided address
   *
   * @param {Joanie.Address} address
   */
  const handleDelete = (address: Joanie.Address) => {
    setError(undefined);
    // eslint-disable-next-line no-alert, no-restricted-globals
    const sure = confirm(
      intl.formatMessage(messages.deletionConfirmation, { title: address.title }),
    );
    if (!address.is_main && sure) {
      addresses.methods.delete(address.id, {
        onError: () => setError(intl.formatMessage(messages.actionDeletion)),
      });
    }
  };

  /**
   * Update the provided address to promote it as main
   *
   * @param {Joanie.Address} address
   */
  const promoteAddress = (address: Joanie.Address) => {
    if (!address.is_main) {
      setError(undefined);
      addresses.methods.update(
        {
          ...address,
          is_main: true,
        },
        {
          onError: () => setError(intl.formatMessage(messages.actionPromotion)),
        },
      );
    }
  };

  /**
   * Create a new address according to form values
   * then update `selectedAddress` state with this new one.
   * If `save` checkbox input is checked, the address is persisted
   * otherwise it is only stored through the `selectedAddress` state.
   *
   * @param {AddressFormValues} formValues address fields to update
   */
  const handleCreate = async ({ save, ...address }: AddressFormValues) => {
    setError(undefined);
    if (save) {
      await addresses.methods.create(address, {
        onSuccess: handleSelect,
        onError: () => setError(intl.formatMessage(messages.actionCreation)),
      });
    } else {
      handleSelect({
        id: LOCAL_BILLING_ADDRESS_ID,
        is_main: false,
        ...address,
      });
    }
  };

  /**
   * Update the `editedAddress` with new values provided as argument
   * then clear `editedAddress` state if request succeeded.
   *
   * @param {AddressFormValues} formValues address fields to update
   */
  const handleUpdate = async ({ save, ...newAddress }: AddressFormValues) => {
    setError(undefined);
    addresses.methods.update(
      {
        ...editedAddress!,
        ...newAddress,
      },
      {
        onSuccess: () => setEditedAddress(undefined),
        onError: () => setError(intl.formatMessage(messages.actionUpdate)),
      },
    );
  };

  /**
   * Prevent form to be submitted and clear `editedAddress` state.
   */
  const resetEditedAddress = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setEditedAddress(undefined);
    return false;
  };

  const onSubmit = useMemo(() => {
    const callback = editedAddress ? handleUpdate : handleCreate;
    return handleSubmit(callback);
  }, [editedAddress, handleSubmit]);

  useEffect(() => {
    reset(editedAddress || defaultValues);
    setError(undefined);
  }, [editedAddress]);

  return (
    <div className="AddressesManagement">
      <button className="button button--tertiary" onClick={handleClose}>
        <svg className="button__icon" role="img">
          <use href="#icon-chevron-down" />
        </svg>
        <FormattedMessage {...messages.closeButton} />
      </button>
      {error && (
        <Banner
          message={intl.formatMessage(messages.error, { action: error })}
          type={BannerType.ERROR}
          rounded
        />
      )}
      {addresses.items.length > 0 ? (
        <section className="address-registered">
          <header>
            <h5>
              <FormattedMessage {...messages.registeredAddresses} />
            </h5>
          </header>
          <ul className="registered-addresses-list">
            {addresses.items.sort(sortAddressByTitleAsc).map((address) => (
              <li className="registered-addresses-item" key={`addresses-list-${address.id}`}>
                <button
                  className="button"
                  onClick={() => promoteAddress(address)}
                  title={intl.formatMessage(messages.promoteTitleButton, { title: address.title })}
                >
                  <span
                    className={`address-main-indicator ${
                      address.is_main ? 'address-main-indicator--is-main' : ''
                    }`}
                  />
                </button>
                <h6 className="registered-addresses-item__title">{address.title}</h6>
                <address className="registered-addresses-item__address">
                  {address.first_name}&nbsp;{address.last_name}
                  <br />
                  {address.address} {address.postcode} {address.city}, {address.country}
                </address>
                <p className="registered-addresses-item__actions">
                  <button
                    title={intl.formatMessage(messages.selectTitleButton, { title: address.title })}
                    className="button button--tiny button--pill button--primary"
                    onClick={() => handleSelect(address)}
                  >
                    <FormattedMessage {...messages.selectButton} />
                  </button>
                  <button
                    title={intl.formatMessage(messages.editTitleButton, { title: address.title })}
                    className="button button--tiny button--tertiary"
                    onClick={() => setEditedAddress(address)}
                  >
                    <FormattedMessage {...messages.editButton} />
                  </button>
                  <button
                    title={intl.formatMessage(messages.deleteTitleButton, {
                      title: address.title,
                    })}
                    className="button button--tiny button--tertiary"
                    disabled={address.is_main}
                    onClick={() => handleDelete(address)}
                  >
                    <FormattedMessage {...messages.deleteButton} />
                  </button>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className={`address-form ${editedAddress ? 'address-form--highlighted' : ''}`}>
        <header>
          <h5>
            {editedAddress ? (
              <FormattedMessage {...messages.editAddress} values={{ title: editedAddress.title }} />
            ) : (
              <FormattedMessage {...messages.addAddress} />
            )}
          </h5>
        </header>
        <form className="form" name="address-form" onSubmit={onSubmit}>
          <TextField
            aria-invalid={!!formState.errors.title}
            aria-required={true}
            id="title"
            label={intl.formatMessage(messages.titleInputLabel)}
            error={!!formState.errors.title}
            {...register('title')}
          />
          <div className="form-group">
            <TextField
              aria-invalid={!!formState.errors.first_name}
              aria-required={true}
              id="first_name"
              label={intl.formatMessage(messages.first_nameInputLabel)}
              error={!!formState.errors.first_name}
              {...register('first_name')}
            />
            <TextField
              aria-invalid={!!formState.errors.last_name}
              aria-required={true}
              id="last_name"
              label={intl.formatMessage(messages.last_nameInputLabel)}
              error={!!formState.errors.last_name}
              {...register('last_name')}
            />
          </div>
          <TextField
            aria-invalid={!!formState.errors.address}
            aria-required={true}
            id="address"
            label={intl.formatMessage(messages.addressInputLabel)}
            error={!!formState.errors.address}
            {...register('address')}
          />
          <div className="form-group">
            <TextField
              aria-invalid={!!formState.errors.postcode}
              aria-required={true}
              id="postcode"
              label={intl.formatMessage(messages.postcodeInputLabel)}
              error={!!formState.errors.postcode}
              {...register('postcode')}
            />
            <TextField
              aria-invalid={!!formState.errors.city}
              aria-required={true}
              id="city"
              label={intl.formatMessage(messages.cityInputLabel)}
              error={!!formState.errors.city}
              {...register('city')}
            />
          </div>
          <SelectField
            aria-invalid={!!formState.errors.country}
            aria-required={false}
            id="country"
            label={intl.formatMessage(messages.countryInputLabel)}
            error={!!formState.errors.country}
            {...register('country', { value: editedAddress?.country, required: true })}
          >
            <option disabled value="-">
              -
            </option>
            {Object.entries(countryList).map(([value, label]) => (
              <option key={`address-countryList-${value}`} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          {!editedAddress ? (
            <CheckboxField
              aria-invalid={!!formState.errors?.save}
              aria-required={false}
              id="save"
              label={intl.formatMessage(messages.saveInputLabel)}
              error={!!formState.errors?.save}
              {...register('save')}
            />
          ) : null}
          <footer className="form__footer">
            {editedAddress ? (
              <Fragment>
                <button
                  title={intl.formatMessage(messages.cancelTitleButton)}
                  className="button button--active"
                  onClick={resetEditedAddress}
                >
                  <FormattedMessage {...messages.cancelButton} />
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={!formState.isValid || addresses.states.updating}
                >
                  <FormattedMessage {...messages.updateButton} />
                </button>
              </Fragment>
            ) : (
              <button
                type="submit"
                className="button button--primary"
                disabled={
                  !formState.isValid || addresses.states.creating || addresses.states.updating
                }
              >
                <FormattedMessage {...messages.selectButton} />
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
};

export default AddressesManagement;
