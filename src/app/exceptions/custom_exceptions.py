

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