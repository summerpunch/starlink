from functools import lru_cache

from sandbox.app.services.file import FileService
from sandbox.app.services.shell import ShellService
from sandbox.app.services.supervisor import SupervisorService


@lru_cache()
def get_shell_service() -> ShellService:
    return ShellService()


@lru_cache()
def get_file_service() -> FileService:
    return FileService()


@lru_cache()
def get_supervisor_service() -> SupervisorService:
    return SupervisorService()
