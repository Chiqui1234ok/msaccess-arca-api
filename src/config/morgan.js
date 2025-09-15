import morgan from 'morgan';

export default morgan(':date[iso] :user-agent :method :url :status');