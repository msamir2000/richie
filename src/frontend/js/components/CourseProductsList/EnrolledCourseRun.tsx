import { useIntl } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useEnrollment } from 'hooks/useEnrollment';
import { useCourse } from 'data/CourseProductsProvider';
import * as Joanie from 'types/Joanie';

const EnrolledCourseRun = ({ courseRun }: { courseRun: Joanie.CourseRunEnrollment }) => {
  const intl = useIntl();
  const { methods, states } = useEnrollment();
  const course = useCourse();

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const unroll = async () => {
    await methods.update({
      course_run: courseRun.resource_link,
      is_active: false,
      id: courseRun!.id,
    });
    course.methods.invalidate();
  };

  return (
    <ol className="course-runs-list">
      <li className="course-runs-item course-runs-item--enrolled">
        <em className="course-runs-item__date">{formatDate(courseRun.start)}</em>
        <span className="course-runs-item__date-separator" />
        <em className="course-runs-item__date">{formatDate(courseRun.end)}</em>
      </li>
      <li>
        <a
          href={courseRun.resource_link}
          className="course-runs-item__cta button--primary button--pill button--tiny"
        >
          Go to course
        </a>
        <button className="button--tiny" onClick={unroll}>
          {states.updating ? <Spinner /> : 'Unenroll'}
        </button>
      </li>
    </ol>
  );
};

export default EnrolledCourseRun;
