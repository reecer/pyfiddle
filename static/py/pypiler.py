import sys, ast, inspect
from cStringIO import StringIO
  
___stack = []

# class Walker(ast.NodeVisitor):
#     def visit_Name(self, node):
#         print "Name: ", ast.dump(node, True, True)
#         return node

def ___twace(frame, event, args):
    """Sys trace while compiling"""
    #if event == 'call' and frame.f_code.co_filename == '<string>':
    ___stack.append(frame)
    return ___twace


def ___exec_python(src):
    """Where the magic happends"""
    # STDOUT stuff
    sys.stdout = out = StringIO()
    std_out = 'stdout'
    error_msg = None
    error_line = None
    error_status = None
    globes = {}
    sys.settrace(___twace)
    ####################################################################          
    #                             EXECUTE IT                           #
    try: 
        tree = ast.parse(src)
        piled = compile(tree, '<string>', 'exec')
        exec(piled, globes)
    #  ERROR HANDLING  #
    except Exception as e:
        sys.settrace(None)
        error_msg = ''
        if hasattr(e, 'lineno'): 
                error_line = e.lineno
        else:
                t_stack = inspect.trace()
                error_msg += "\n TRACEBACK\n" + "-" * 24
                for i in t_stack[1:]:
                        error_msg += '\nLine %d in %s:\n\tin %s:\n' % (i[2], i[1], i[3])
                        if t_stack.index(i) == 1: error_line = i[2]
                        if i[4]: error_msg += '\t>> %s' % i[4][0].strip()       
        # append sys_exc info
        sysinf = sys.exc_info() 
        error_status = str(sysinf[1])
        error_msg += '\n' + error_status
    #                                                                  #
    ####################################################################          
    sys.settrace(None)
    std_out = out.getvalue()[:]
    out.close()
    sys.stdout = sys.__stdout__#preserve
    outp = {
            "error" : [error_msg, error_line, error_status],
            "stdout" : std_out,
            "frames" : ___stack,
            "globals": globes,
            "tree"   : tree
    }
    return outp
    