import { useIntl } from 'react-intl';
import * as Joanie from 'types/Joanie';

export interface CourseRunListProps {
  baseKey: string;
  courseRuns: Joanie.CourseRun[];
}

const CourseRunList = ({ baseKey, courseRuns }: CourseRunListProps) => {
  const intl = useIntl();

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <ol className="course-runs-list">
      {courseRuns.map((courseRun) => (
        <li
          key={`${baseKey}-${courseRun.id}`}
          className="course-runs-item course-runs-item--inactive"
        >
          <em className="course-runs-item__date course-runs-item__date--start">
            {formatDate(courseRun.start)}
          </em>
          <span className="course-runs-item__date-separator" />
          <em className="course-runs-item__date course-runs-item__date--end">
            {formatDate(courseRun.end)}
          </em>
        </li>
      ))}
    </ol>
  );
};

export default CourseRunList;
