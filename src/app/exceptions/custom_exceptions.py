from jwt import InvalidTokenError, ExpiredSignatureError

class InternalServerError(Exception):
  def __init__(self, detail="Internal server error occured", error_code="INTERNAL_SERVER_ERROR" ):
    self.detail = detail
    self.error_code = error_code


class DuplicateEntryException(Exception):
  def __init__(self, detail="Duplicate entry", error_code="DUPLICATE_ENTRY"):
    self.detail = detail
    self.error_code = error_code


class ResourceNotFoundException(Exception):
  def __init__(self, detail="Resource not found", error_code="NOT_FOUND"):
    self.detail = detail
    self.error_code = error_code


class UnauthorizedAccessException(Exception):
  def __init__(self, detail="Unauthorized access", error_code="UNAUTHORIZED_ACCESS"):
    self.detail = detail
    self.error_code = error_code


class ForbiddenAccessException(Exception):
  def __init__(self, detail="Forbidden access", error_code="FORBIDDEN"):
    self.detail = detail
    self.error_code = error_code


class InvalidTokenException(Exception):
  def __init__(self, detail="Invalid token", error_code="INVALID_TOKEN"):
    self.detail = detail
    self.error_code = error_code
    

class FileDownloadException(Exception):
  def __init__(self, detail="Download error", error_code="BAD_REQUEST"):
    self.detail = detail
    self.error_code = error_code