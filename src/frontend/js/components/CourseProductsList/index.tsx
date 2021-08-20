import { Fragment } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { CourseProvider, useCourse } from 'data/CourseProductsProvider';
import { Spinner } from 'components/Spinner';
import { SaleTunnel } from 'components/SaleTunnel';
import * as Joanie from 'types/Joanie';
import CourseRunList from './CourseRunList';
import EnrolledCourseRun from './EnrolledCourseRun';
import EnrollableCourseRunList from './EnrollableCourseRunList';
import PurchasedProductMenu from './PurchasedProductMenu';

const messages = defineMessages({
  enrolled: {
    defaultMessage: 'Enrolled',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductsList.enrolled',
  },
  start: {
    defaultMessage: 'Start',
    description: 'Start label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.start',
  },
  end: {
    defaultMessage: 'End',
    description: 'End label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.end',
  },
  certificateExplanation: {
    defaultMessage:
      'You will be able to download your certificate once you will pass all course runs.',
    description: 'Text displayed when the product certificate has no description',
    id: 'components.CourseProductsList.certificateExplanation',
  },
  loadingInitial: {
    defaultMessage: 'Loading course information...',
    description:
      'Accessible text for the initial loading spinner displayed when course is fetching',
    id: 'components.CourseProductsList.loadingInitial',
  },
});

interface Props {
  code: Joanie.Course['code'];
}

const List = () => {
  const course = useCourse();
  const orders = useOrders();
  const intl = useIntl();

  const getProductOrder = (productId: Joanie.Course['products'][0]['id']) => {
    return course.item?.orders?.find((order) => order.product === productId);
  };

  const isOwned = (productId: Joanie.Course['products'][0]['id']) => {
    return Boolean(getProductOrder(productId));
  };

  const getCourseRunEnrollment = (
    productId: string,
    targetCourse: Joanie.CourseProductTargetCourse,
  ) => {
    const resourceLinks = targetCourse.course_runs.map(({ resource_link }) => resource_link);
    const order = course.item?.orders?.find(({ product }) => product === productId);
    if (!order) return undefined;

    return order.enrollments.find(({ is_active, resource_link }) => {
      return is_active && resourceLinks.includes(resource_link);
    });
  };

  const isEnrolled = (productId: string, targetCourse: Joanie.CourseProductTargetCourse) => {
    return !!getCourseRunEnrollment(productId, targetCourse)?.is_active;
  };

  const generateKey = (tree: object) =>
    Object.entries(tree).reduce((key, [property, value]) => {
      if (key.length > 1) key += '-';
      key += `${property}-${value}`;
      return key;
    }, '');

  if (course.states.fetching) {
    return (
      <Spinner aria-labelledby="loading-course">
        <span id="loading-course">
          <FormattedMessage {...messages.loadingInitial} />
        </span>
      </Spinner>
    );
  }
  if (!course.item) return null;

  return (
    <Fragment>
      {course.item.products.map((product) => (
        <section key={generateKey({ product: product.id })} className="product-widget">
          <header className="product-widget__header">
            <h3 className="product-widget__title">{product.title}</h3>
            <h6 className="product-widget__price">
              {isOwned(product.id) ? (
                <FormattedMessage {...messages.enrolled} />
              ) : (
                <FormattedNumber
                  currency={product.price_currency}
                  value={product.price}
                  style="currency"
                />
              )}
            </h6>
            {isOwned(product.id) && <PurchasedProductMenu order={getProductOrder(product.id)!} />}
          </header>
          <ol className="product-widget__content">
            {product.target_courses.map((target_course) => (
              <li
                key={generateKey({ product: product.id, course: target_course.code })}
                className="product-widget__item course"
              >
                <h5 className="product-widget__item-title">{target_course.title}</h5>
                <section className="course__course-runs">
                  <header className="course__course-runs-header">
                    <strong>
                      <FormattedMessage {...messages.start} />
                    </strong>
                    <strong>
                      <FormattedMessage {...messages.end} />
                    </strong>
                  </header>
                  {!isOwned(product.id) && (
                    <CourseRunList
                      baseKey={generateKey({ product: product.id, course: target_course.code })}
                      courseRuns={target_course.course_runs}
                    />
                  )}
                  {isOwned(product.id) && !isEnrolled(product.id, target_course) && (
                    <EnrollableCourseRunList
                      baseKey={generateKey({ product: product.id, course: target_course.code })}
                      courseRuns={target_course.course_runs}
                      order={getProductOrder(product.id)!}
                    />
                  )}
                  {isOwned(product.id) && isEnrolled(product.id, target_course) && (
                    <EnrolledCourseRun
                      courseRun={getCourseRunEnrollment(product.id, target_course)!}
                    />
                  )}
                </section>
              </li>
            ))}
            {product.certificate && (
              <li className="product-widget__item certificate">
                <svg className="certificate__icon" role="img" viewBox="0 0 25 34">
                  <use href="#icon-certificate" />
                </svg>
                <div>
                  <h5 className="product-widget__item-title">{product.certificate.title}</h5>
                  <p className="product-widget__item-description">
                    {product.certificate.description || (
                      <FormattedMessage {...messages.certificateExplanation} />
                    )}
                  </p>
                </div>
              </li>
            )}
          </ol>
          {!isOwned(product.id) ? (
            <footer className="product-widget__footer">
              <SaleTunnel product={product} />
            </footer>
          ) : null}
        </section>
      ))}
    </Fragment>
  );
};

const CourseProductsList = ({ code }: Props) => (
  <CourseProvider code={code}>
    <List />
  </CourseProvider>
);

export default CourseProductsList;
