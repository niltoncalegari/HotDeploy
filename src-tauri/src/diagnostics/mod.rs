mod log;
mod report;

pub use log::{append_log_line, log_file_path, read_log_tail};
pub use report::build_diagnostics_report;
