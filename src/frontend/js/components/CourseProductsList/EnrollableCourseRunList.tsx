import React, { ReactEventHandler, useRef, useState } from 'react';
import { useIntl, FormattedMessage, defineMessages } from 'react-intl';
import * as Joanie from 'types/Joanie';
import { useEnrollment } from 'hooks/useEnrollment';
import { Spinner } from 'components/Spinner';
import { useCourse } from 'data/CourseProductsProvider';
import { Maybe } from 'types/utils';
import { CourseRunListProps } from './CourseRunList';

const messages = defineMessages({
  enroll: {
    defaultMessage: 'Enroll',
    description: 'Text label for the enroll button',
    id: 'components.CourseProductsList.enroll',
  },
});

interface EnrollCourseRunListProps extends CourseRunListProps {
  order: Joanie.OrderLite;
}

const EnrollableCourseRunList = ({ baseKey, courseRuns, order }: EnrollCourseRunListProps) => {
  const intl = useIntl();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCourseRun, setSelectedCourseRun] = useState<Maybe<any>>();
  const enrollment = useEnrollment();
  const course = useCourse();

  const handleChange = () => {
    const form = formRef.current;
    const selectedInput = Array.from(form?.elements || [])
      .filter((element) => element instanceof HTMLInputElement)
      .find((element) => {
        if (element instanceof HTMLInputElement) {
          return !!element?.checked;
        }
        return false;
      });

    const courseRunId = selectedInput?.id.split('|')[1];
    const courseRun = courseRuns.find(({ resource_link }) => resource_link === courseRunId);
    setSelectedCourseRun(courseRun);
  };

  const handleEnroll: ReactEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    if (selectedCourseRun) {
      const relatedEnrollment = order.enrollments.find(({ resource_link }) => {
        return resource_link === selectedCourseRun.resource_link;
      });
      if (relatedEnrollment) {
        await enrollment.methods.update({
          is_active: true,
          course_run: selectedCourseRun.resource_link,
          id: relatedEnrollment.id,
        });
      } else {
        await enrollment.methods.create({
          is_active: true,
          order: order.id,
          course_run: selectedCourseRun.resource_link,
        });
      }
      course.methods.invalidate();
    }
  };

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <form ref={formRef} onChange={handleChange}>
      <ol className="course-runs-list">
        {courseRuns.map((courseRun) => (
          <li
            className="course-runs-item course-runs-item form-field"
            key={`${baseKey}-${courseRun.id}`}
          >
            <input
              className="form-field__radio-input"
              type="radio"
              id={`${baseKey}|${courseRun.resource_link}`}
              name={baseKey}
            />
            <label className="form-field__label" htmlFor={`${baseKey}|${courseRun.resource_link}`}>
              <span className="form-field__radio-control" />
              <em className="course-runs-item__date course-runs-item__date--start">
                {formatDate(courseRun.start)}
              </em>
              <span className="course-runs-item__date-separator" />
              <em className="course-runs-item__date course-runs-item__date--end">
                {formatDate(courseRun.end)}
              </em>
            </label>
          </li>
        ))}
        <li className="course-runs-item">
          <button
            className="course-runs-item__cta button--primary button--pill button--tiny"
            disabled={!selectedCourseRun}
            onClick={handleEnroll}
          >
            {enrollment.states.creating || enrollment.states.updating ? (
              <Spinner theme="light" />
            ) : (
              <FormattedMessage {...messages.enroll} />
            )}
          </button>
        </li>
      </ol>
    </form>
  );
};

export default EnrollableCourseRunList;
