

class DuplicateEntryException(Exception):
  def __init__(self, detail="Duplicate entry", error_code="DUPLICATE_ENTRY"):
    self.detail = detail
    self.error_code = error_code


class ResourceNotFoundException(Exception):
  def __init__(self, detail="Resource not found", error_code="NOT_FOUND"):
    self.detail = detail
    self.error_code = error_code